import { NextResponse } from "next/server";

interface MssqlError extends Error {
    number?: number;   // MSSQL error number (e.g. 2627, 547)
    code?: string;     // mssql driver code (e.g. 'EREQUEST')
    precedingSql?: string;
}

export function handleApiError(error: unknown, context: string = "action") {
    console.error(`❌ Greška u API-ju (${context}):`, error);

    if (error && typeof error === 'object') {
        const mssqlError = error as MssqlError;
        const msg = mssqlError.message || '';
        const num = mssqlError.number;

        // MSSQL 2601 / 2627: Unique constraint violation
        if (num === 2601 || num === 2627 || msg.includes('2601') || msg.includes('2627') ||
            msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {

            let message = "Podatak već postoji u bazi.";
            if (msg.toLowerCase().includes('pib')) message = "Pravno lice sa ovim PIB-om već postoji.";
            if (msg.toLowerCase().includes('email')) message = "Korisnik sa ovom email adresom već postoji.";
            if (msg.toLowerCase().includes('maticni_broj')) message = "Pravno lice sa ovim matičnim brojem već postoji.";

            return NextResponse.json({ error: message }, { status: 409 });
        }

        // MSSQL 547: Foreign key constraint violation
        if (num === 547 || msg.includes('547') ||
            msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('reference')) {

            return NextResponse.json(
                { error: "Nije moguće obrisati ili izmeniti zapis koji je u upotrebi od strane drugog zapisa." },
                { status: 409 }
            );
        }

        // MSSQL 8152: String or binary data would be truncated
        if (num === 8152 || msg.includes('8152') || msg.toLowerCase().includes('truncat')) {
            return NextResponse.json(
                { error: "Uneti podatak je predugačak. Molimo proverite dužinu unosa." },
                { status: 400 }
            );
        }

        // MSSQL 515: Cannot insert NULL into non-nullable column
        if (num === 515 || msg.toLowerCase().includes('cannot insert the value null')) {
            return NextResponse.json(
                { error: "Nedostaje obavezan podatak. Popunite sva obavezna polja." },
                { status: 400 }
            );
        }

        // Connection / timeout errors
        if (mssqlError.code === 'ECONNCLOSED' || mssqlError.code === 'ENOTOPEN' ||
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
