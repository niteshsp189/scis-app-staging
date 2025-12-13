
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { useIsMobile } from "@/hooks/use-mobile";

const Architecture = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} min-h-screen bg-gray-50`}>
      <ArchitectureDiagram />
    </div>
  );
};

export default Architecture;
