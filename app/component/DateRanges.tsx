"use client";

import { DateRange, RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

type Props = {
    label?: string;
    value: { startDate: Date; endDate: Date };
    onChange: (range: { startDate: Date; endDate: Date }) => void;
};

export default function DateRanges({ label, value, onChange }: Props) {
    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium">{label}</label>}
            <DateRange
                ranges={[{
                    startDate: value.startDate,
                    endDate: value.endDate,
                    key: "selection"
                }]}
                onChange={(ranges: RangeKeyDict) => {
                    const { startDate, endDate } = ranges.selection;
                    onChange({ startDate: startDate!, endDate: endDate! }); // use ! only if you're sure they exist
                }}
                moveRangeOnFirstSelection={false}
                months={1}
                direction="horizontal"
            />
        </div>
    );
}
