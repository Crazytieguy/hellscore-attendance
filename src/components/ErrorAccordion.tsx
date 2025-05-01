import { useState } from "react";

export const ErrorAccordion = ({
  title,
  details,
}: {
  title: string;
  details: string;
}) => {
  const [accordionOpen, setAccordionOpen] = useState(false);
  return (
    <div className="w-80 bg-transparent text-white">
      <div className="flex cursor-pointer items-center justify-between">
        <span className="text-lg font-medium">{title}</span>
        <button
          className="text-white focus:outline-none"
          onClick={() => setAccordionOpen(!accordionOpen)}
          data-cy="expand-button"
        >
          {accordionOpen ? "▲" : "▼"}
        </button>
      </div>
      {accordionOpen && <div className="mt-2 text-sm">{details}</div>}
    </div>
  );
};
