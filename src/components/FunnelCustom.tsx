// src/components/FunnelCustom.tsx
interface FunnelItem {
    name: string;
    value: number;
    fill: string;
  }
  
  export function FunnelCustom({ data }: { data: FunnelItem[] }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const MIN_WIDTH = 40; // % mínimo para a barra não sumir
  
    return (
      <div className="flex flex-col items-center gap-0 w-full py-2">
        {data.map((item, i) => {
          const widthPct = MIN_WIDTH + ((item.value / max) * (100 - MIN_WIDTH));
          const prev = i > 0 ? data[i - 1].value : null;
          const taxa = prev && prev > 0
            ? ((item.value / prev) * 100).toFixed(0)
            : null;
  
          return (
            <div key={item.name} className="flex flex-col items-center w-full">
              {/* Taxa de queda entre etapas */}
              {taxa && (
                <div className="flex items-center gap-1 my-1">
                  <div className="h-px w-8 bg-border" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {taxa}%
                  </span>
                  <div className="h-px w-8 bg-border" />
                </div>
              )}
  
              {/* Barra do funil */}
              <div
                className="flex items-center justify-between px-4 py-2.5 rounded-md transition-all duration-500 cursor-default hover:brightness-110"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: item.fill,
                  minWidth: "180px",
                }}
                title={`${item.name}: ${item.value.toLocaleString("pt-BR")}`}
              >
                <span className="text-white text-xs font-semibold truncate max-w-[70%] drop-shadow">
                  {item.name}
                </span>
                <span className="text-white text-xs font-bold tabular-nums ml-2 shrink-0 drop-shadow">
                  {item.value.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }