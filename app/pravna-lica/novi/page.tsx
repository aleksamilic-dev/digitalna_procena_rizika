'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LegalEntityForm from '../../components/LegalEntityForm';
import { pageContainer } from '../../components/ui';

export default function NovoPravnoLicePage() {
    const router = useRouter();

    const handleSuccess = () => {
        // Nakon uspesnog kreiranja, preusmeri na listu pravnih lica
        router.push('/pravna-lica');
    };

    return (
        <div className={pageContainer}>
            <Link href="/pravna-lica" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
                <ArrowLeft className="h-4 w-4" />
                Pravna lica
            </Link>

            <div>
                <LegalEntityForm
                    onSuccess={handleSuccess}
                    submitLabel="Сачувај правно лице"
                    loadingLabel="Чувам..."
                />
            </div>
        </div>
    );
}
