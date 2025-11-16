import { Card, CardTitle } from "@/components/ui/card";
import { getFileIcon } from "@/lib/utils";

export function SearchResultItem({ file, onFileClick }) {
  if (!file) return null;

  const { icon: IconComponent } = getFileIcon(file);

  const handleItemClick = (e) => {
    e.stopPropagation();
    if (onFileClick) onFileClick(file);
  };

  return (
    <Card
      onClick={handleItemClick}
      className="cursor-pointer hover:shadow-lg transition-shadow py-6 px-4"
    >
      <CardTitle className="flex flex-col items-center justify-center gap-2 text-center h-full">
        <div className="flex shrink-0 w-10 h-10 text-center items-center justify-center text-4xl">
          {IconComponent}
        </div>
        <span className="text-sm font-semibold truncate max-w-full text-center text-foreground mt-2">
          {file.filename}
        </span>
      </CardTitle>
    </Card>
  );
}
