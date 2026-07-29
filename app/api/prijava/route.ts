import {NextRequest, NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {getDbConnection} from '../../../lib/db';
import type {Korisnik} from '../../../lib/db-types';

export async function POST(request: NextRequest) {
    try {
        const {email, lozinka} = await request.json();

        if (!email || !lozinka) {
            return NextResponse.json(
                {greška: 'Email i lozinka su obavezni'},
                {status: 400}
            );
        }

        const pool = await getDbConnection();

        // Pronalaženje korisnika
        const result = await pool.query<Korisnik>('SELECT * FROM korisnici WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                {greška: 'Pogrešan email ili lozinka'},
                {status: 401}
            );
        }

        const korisnik = result.rows[0];

        // Proverava lozinku
        const isPasswordValid = await bcrypt.compare(lozinka, korisnik.lozinka);

        if (!isPasswordValid) {
            return NextResponse.json(
                {greška: 'Pogrešan email ili lozinka'},
                {status: 401}
            );
        }

        // Provera statusa
        if (korisnik.status === 'na_cekanju') {
            return NextResponse.json(
                {greška: 'Vaš nalog još uvek nije odobren od strane administratora'},
                {status: 403}
            );
        }

        if (korisnik.status === 'odbačen') {
            return NextResponse.json(
                {greška: 'Vaš nalog je odbačen od strane administratora'},
                {status: 403}
            );
        }

        // Kreiranje JWT tokena sa je_admin poljem
        const token = jwt.sign(
            {
                id: korisnik.id,
                email: korisnik.email,
                ime: korisnik.ime,
                prezime: korisnik.prezime,
                je_admin: korisnik.je_admin
            },
            process.env.JWT_SECRET!,
            {expiresIn: '24h'}
        );

        return NextResponse.json({
            poruka: 'Uspešno ste se prijavili!',
            token,
            korisnik: {
                id: korisnik.id,
                email: korisnik.email,
                ime: korisnik.ime,
                prezime: korisnik.prezime,
                je_admin: korisnik.je_admin
            }
        });
    } catch (error) {
        console.error('Greška pri prijavi:', error);
        return NextResponse.json(
            {
                greška: 'Došlo je do greške pri prijavi', 
                detalji: error instanceof Error ? error.message : String(error)
            },
            {status: 500}
        );
    }
}
