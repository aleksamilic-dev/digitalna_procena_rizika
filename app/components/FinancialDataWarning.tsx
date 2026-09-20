'use client';

import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { btn } from './ui';

interface FinancialDataWarningProps {
  onOpenForm: () => void;
}

export default function FinancialDataWarning({ onOpenForm }: FinancialDataWarningProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Недостају финансијски подаци</p>
          <p className="mt-1">
            Према SRPS A.L2.003:2025 потребни су пословни приходи (AOP 1001), вредност имовине и тип делатности.
            Без њих се штета и ниво ризика рачунају са подразумеваним вредностима.
          </p>
        </div>
      </div>
      <button onClick={onOpenForm} className={`${btn.primary} shrink-0`}>
        Унеси финансијске податке
      </button>
    </div>
  );
}
