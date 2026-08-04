import { NextResponse } from "next/server";

interface DbError extends Error {
    code?: string;     // PostgreSQL error code (e.g. '23505', '23503')
    detail?: string;   // pg detail message
    constraint?: string;
}

export function handleApiError(error: unknown, context: string = "action") {
    console.error(`❌ Greška u API-ju (${context}):`, error);

    if (error && typeof error === 'object') {
        const dbError = error as DbError;
        const msg = dbError.message || '';
        const code = dbError.code || '';
        const detail = dbError.detail || '';

        // PostgreSQL 23505: Unique constraint violation
        if (code === '23505' || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
            let message = "Podatak već postoji u bazi.";
            const combined = (msg + detail).toLowerCase();
            if (combined.includes('pib')) message = "Pravno lice sa ovim PIB-om već postoji.";
            if (combined.includes('email')) message = "Korisnik sa ovom email adresom već postoji.";
            if (combined.includes('maticni_broj')) message = "Pravno lice sa ovim matičnim brojem već postoji.";
            return NextResponse.json({ error: message }, { status: 409 });
        }

        // PostgreSQL 23503: Foreign key constraint violation
        if (code === '23503' || msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('violates')) {
            return NextResponse.json(
                { error: "Nije moguće obrisati ili izmeniti zapis koji je u upotrebi od strane drugog zapisa." },
                { status: 409 }
            );
        }

        // PostgreSQL 22001: String data right truncation
        if (code === '22001' || msg.toLowerCase().includes('value too long')) {
            return NextResponse.json(
                { error: "Uneti podatak je predugačak. Molimo proverite dužinu unosa." },
                { status: 400 }
            );
        }

        // PostgreSQL 23502: Not null violation
        if (code === '23502' || msg.toLowerCase().includes('null value')) {
            return NextResponse.json(
                { error: "Nedostaje obavezan podatak. Popunite sva obavezna polja." },
                { status: 400 }
            );
        }

        // Connection / timeout errors
        if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(code) ||
            msg.toLowerCase().includes('connection') || msg.toLowerCase().includes('timeout')) {
            return NextResponse.json(
                { error: "Greška pri konekciji sa bazom podataka. Pokušajte ponovo." },
                { status: 503 }
            );
        }
    }

    // Default
    return NextResponse.json(
        { error: "Došlo je do greške na serveru. Molimo pokušajte ponovo." },
        { status: 500 }
    );
}
