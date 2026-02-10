const fs = require('fs');
const path = 'components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = "const AICard = ({ type }: { type: 'full' | 'revenue' | 'expenses' }) => {";
const endMarker = "const DateFilter = () => (";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    console.log(`Found markers at ${startIndex} and ${endIndex}`);
    // Find the last closing brace before DateFilter
    // Actually, we can just cut everything between markers and insert new code
    // But we need to keep whitespace correct.

    // Check if there is a closing brace and newline before endMarker
    // The previous code had `  };\n\n  const DateFilter`

    const newAICard = `  const AICard = ({ type }: { type: 'full' | 'revenue' | 'expenses' }) => {
    return (
      <div className="p-8 rounded-[2.5rem] bg-slate-800 text-white shadow-lg">
        <h3 className="text-xl font-bold">Computed AI Analysis</h3>
        <p className="mt-4">{type === 'full' ? 'General Analysis' : (type === 'revenue' ? 'Revenue Intelligence' : 'Cost Audit')}</p>
        <p className="text-sm mt-2 opacity-80">{aiAnalysis || "Loading analysis..."}</p>
      </div>
    );
  };

`;

    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);

    const newContent = before + newAICard + "  " + after; // Indentation adjustment

    fs.writeFileSync(path, newContent);
    console.log("Replaced AICard successfully.");
} else {
    console.error("Could not find markers.");
    console.log("Start marker index:", startIndex);
    console.log("End marker index:", endIndex);
}
