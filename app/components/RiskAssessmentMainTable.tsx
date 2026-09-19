"use client";
import { RiskGroupData } from "../data/riskGroups";

interface RiskAssessmentMainTableProps {
    riskGroupData: RiskGroupData;
    onCellClick: (riskId: string, dangerLevel: number, description: string) => void;
    getCellClass: (riskId: string, level: number, hasContent: boolean) => string;
}

export default function RiskAssessmentMainTable({
    riskGroupData,
    onCellClick,
    getCellClass
}: RiskAssessmentMainTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-800">
                {/* Header */}
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-gray-800 p-3 text-sm font-bold text-center w-20 text-black">
                            Р.<br />бр.
                        </th>
                        <th className="border border-gray-800 p-3 text-sm font-bold text-center w-60 text-black">
                            Захтев за процену<br />ризика
                        </th>
                        <th className="border border-gray-800 p-3 text-sm font-bold text-center bg-gray-300 text-black" colSpan={5}>
                            ВЕЛИЧИНА ОПАСНОСТИ
                        </th>
                        <th className="border border-gray-800 p-3 text-sm font-bold text-center bg-gray-400 text-black">
                            Н/А
                        </th>
                    </tr>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-800 p-2"></th>
                        <th className="border border-gray-800 p-2"></th>
                        <th className="border border-gray-800 p-2 text-sm font-bold text-center w-40 text-black">
                            Максимална<br />5
                        </th>
                        <th className="border border-gray-800 p-2 text-sm font-bold text-center w-40 text-black">
                            Велика<br />4
                        </th>
                        <th className="border border-gray-800 p-2 text-sm font-bold text-center w-40 text-black">
                            Средња<br />3
                        </th>
                        <th className="border border-gray-800 p-2 text-sm font-bold text-center w-40 text-black">
                            Мала<br />2
                        </th>
                        <th className="border border-gray-800 p-2 text-sm font-bold text-center w-40 text-black">
                            Минимална<br />1
                        </th>
                        <th className="border border-gray-800 p-2 text-sm font-bold text-center w-32 text-black">
                            Није<br />применљиво
                        </th>
                    </tr>
                </thead>

                {/* Body */}
                <tbody>
                    {riskGroupData.risks.map((risk) => (
                        risk.items.map((item, itemIndex) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                {itemIndex === 0 && (
                                    <>
                                        <td
                                            className="border border-gray-800 p-3 text-sm font-semibold text-center align-top text-black"
                                            rowSpan={risk.items.length}
                                        >
                                            {risk.id}
                                        </td>
                                        <td
                                            className="border border-gray-800 p-3 text-sm align-top font-bold text-black"
                                            rowSpan={risk.items.length}
                                        >
                                            <div className="font-medium">
                                                {risk.title}
                                            </div>
                                        </td>
                                    </>
                                )}

                                {/* Danger level cells */}
                                {[5, 4, 3, 2, 1].map((level) => {
                                    const content = item.levels[level as keyof typeof item.levels];
                                    const hasContent = Boolean(content && String(content).trim() !== "");

                                    return (
                                        <td
                                            key={level}
                                            className={getCellClass(item.id, level, hasContent)}
                                            onClick={() => hasContent && onCellClick(item.id, level, String(content))}
                                        >
                                            {content}
                                        </td>
                                    );
                                })}

                                {/* N/A cell */}
                                <td
                                    key="na"
                                    className={getCellClass(item.id, 0, true)} // Using 0 for N/A level
                                    onClick={() => onCellClick(item.id, 0, "Није применљиво / Not Applicable")}
                                >
                                    <div className="text-center font-medium text-gray-700">
                                        Н/А
                                    </div>
                                </td>
                            </tr>
                        ))
                    ))}
                </tbody>
            </table>
        </div>
    );
}