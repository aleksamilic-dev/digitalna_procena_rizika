"use client";

interface RiskAssessmentHeaderProps {
    groupName: string;
    groupDescription: string;
}

export default function RiskAssessmentHeader({ groupName, groupDescription }: RiskAssessmentHeaderProps) {
    return (
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{groupName}</h2>
            <p className="mt-0.5 text-sm text-slate-600">{groupDescription}</p>
        </div>
    );
}
