import {
  MAX_REPEAT_WEEKS,
  REPEAT_OPTIONS,
  type RepeatFrequency,
} from "./recurrence";

const inputClassName =
  "mt-1 block h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

type RepeatFieldsProps = {
  frequency: RepeatFrequency;
  repeatWeeks: string;
  onFrequencyChange: (frequency: RepeatFrequency) => void;
  onRepeatWeeksChange: (weeks: string) => void;
};

export function RepeatFields({
  frequency,
  repeatWeeks,
  onFrequencyChange,
  onRepeatWeeksChange,
}: RepeatFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        Repeat
        <select
          className={inputClassName}
          value={frequency}
          onChange={(event) =>
            onFrequencyChange(event.target.value as RepeatFrequency)
          }
        >
          {REPEAT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {frequency !== "none" ? (
        <label className="block text-sm font-medium">
          Repeat for (weeks)
          <input
            className={inputClassName}
            max={MAX_REPEAT_WEEKS}
            min="1"
            step="1"
            type="number"
            value={repeatWeeks}
            onChange={(event) => onRepeatWeeksChange(event.target.value)}
            required
          />
        </label>
      ) : null}
    </div>
  );
}
