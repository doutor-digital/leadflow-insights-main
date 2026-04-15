// src/components/FunnelCustom.tsx
interface FunnelItem {
    name: string;
    value: number;
    fill: string;
  }
  
  export function FunnelCustom({ data }: { data: FunnelItem[] }) {
    const max = Math.max(...data.map((d) => d.value), 1);
  
    return (
      <div className="flex flex-col gap-2 py-2 px-1">
        {data.map((item, i) => {
          const pct = (item.value / max) * 100;
          // funil: a barra vai afunilando a cada etapa
          const marginPct = (i * 4); // indent cresce por etapa
  
          return (
            <div key={item.name} className="group relative">
              {/* Barra */}
              <div
                className="relative flex items-center h-10 rounded-md overflow-hidden transition-all duration-500"
                style={{
                  marginLeft:  `${marginPct}%`,
                  marginRight: `${marginPct}%`,
                  background: `${item.fill}22`, // fundo suave
                  border: `1px solid ${item.fill}55`,
                }}
              >
                {/* Preenchimento proporcional */}
                <div
                  className="absolute left-0 top-0 h-full rounded-md transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: item.fill,
                    opacity: 0.85,
                  }}
                />
  
                {/* Label sobre a barra */}
                <div className="relative z-10 flex w-full items-center justify-between px-3">
                  <span className="text-xs font-semibold text-white drop-shadow-sm truncate max-w-[60%]">
                    {item.name}
                  </span>
                  <span className="text-xs font-bold text-white drop-shadow-sm tabular-nums">
                    {item.value.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
  
              {/* Seta conectora (exceto último) */}
              {i < data.length - 1 && (
                <div className="flex justify-center my-0.5">
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                    <path d="M8 10L0 0H16L8 10Z" fill={data[i + 1].fill} opacity={0.5} />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
  
        {/* Legenda de taxa de conversão entre etapas */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {data.map((item, i) => {
            if (i === 0) return null;
            const prev = data[i - 1].value;
            const taxa = prev > 0 ? ((item.value / prev) * 100).toFixed(0) : "—";
            return (
              <span
                key={item.name}
                className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
              >
                {data[i - 1].name} → {item.name}:{" "}
                <strong className="text-foreground">{taxa}%</strong>
              </span>
            );
          })}
        </div>
      </div>
    );
  }