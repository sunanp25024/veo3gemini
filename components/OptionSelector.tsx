
import React from 'react';

interface OptionSelectorProps<T extends string> {
  label: string;
  options: T[];
  selectedValue: T;
  onChange: (value: T) => void;
}

export const OptionSelector = <T extends string,>({ label, options, selectedValue, onChange }: OptionSelectorProps<T>) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex space-x-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-4 py-2 text-sm rounded-md transition-colors duration-200 ${
              selectedValue === option
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
