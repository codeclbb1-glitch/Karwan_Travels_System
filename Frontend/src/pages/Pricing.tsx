import { useMemo } from "react";
import { Tag, Moon, Globe, TrendingUp, TrendingDown } from "lucide-react";
import { useApp } from "../context";
import { formatPKR } from "../data";

export default function Pricing() {
  const { hajjPackages, umrahPackages, setHajjPackages, setUmrahPackages, showToast } = useApp();

  const allPackages = useMemo(() => {
    const hajj = hajjPackages.map((p) => {
      const cost = p.hotelCost + p.ticketCost + p.visaCost + p.transportCost + p.foodCost + p.otherCost;
      return {
        id: p.id,
        name: p.name,
        type: "Hajj" as const,
        cost,
        agentPrice: p.agentPrice,
        customerPrice: p.sellingPrice,
        companyProfit: p.sellingPrice - cost,
        agentProfit: p.agentPrice - cost,
      };
    });
    const umrah = umrahPackages.map((p) => {
      const cost = p.airlineCost + p.visaCost + p.hotelMadinaCost + p.hotelMakkahCost + p.transportCost + p.foodCost + p.otherCost;
      return {
        id: p.id,
        name: p.name,
        type: "Umrah" as const,
        cost,
        agentPrice: p.agentPrice,
        customerPrice: p.sellingPrice,
        companyProfit: p.sellingPrice - cost,
        agentProfit: p.agentPrice - cost,
      };
    });
    return [...hajj, ...umrah];
  }, [hajjPackages, umrahPackages]);

  const updatePrice = (id: string, type: "Hajj" | "Umrah", field: "agentPrice" | "customerPrice", value: number) => {
    if (type === "Hajj") {
      setHajjPackages(hajjPackages.map((p) => (p.id === id ? { ...p, [field === "agentPrice" ? "agentPrice" : "sellingPrice"]: value } : p)));
    } else {
      setUmrahPackages(umrahPackages.map((p) => (p.id === id ? { ...p, [field === "agentPrice" ? "agentPrice" : "sellingPrice"]: value } : p)));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Pricing Configuration</h1>
        <p className="text-navy-400 text-sm mt-1">3-tier price breakdown per package — Cost, Agent, Customer</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Package</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Cost Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Agent Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Agent Profit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Customer Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Company Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {allPackages.map((p) => (
                <tr key={p.id} className="table-row-hover">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {p.type === "Hajj" ? (
                        <Moon className="w-4 h-4 text-primary-600" />
                      ) : (
                        <Globe className="w-4 h-4 text-gold-600" />
                      )}
                      <div>
                        <p className="font-medium text-navy-800 text-sm">{p.name}</p>
                        <p className="text-xs text-navy-400">{p.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-navy-600 font-medium">{formatPKR(p.cost)}</td>
                  <td className="px-4 py-4 text-right">
                    <input
                      type="number"
                      className="input py-1.5 text-right text-sm w-32 ml-auto"
                      value={p.agentPrice}
                      onChange={(e) => updatePrice(p.id, p.type, "agentPrice", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${p.agentProfit >= 0 ? "text-primary-600" : "text-red-500"}`}>
                      {p.agentProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {formatPKR(p.agentProfit)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <input
                      type="number"
                      className="input py-1.5 text-right text-sm w-32 ml-auto"
                      value={p.customerPrice}
                      onChange={(e) => updatePrice(p.id, p.type, "customerPrice", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${p.companyProfit >= 0 ? "text-primary-600" : "text-red-500"}`}>
                      {p.companyProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {formatPKR(p.companyProfit)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
          <span className="text-navy-600">Green = Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-navy-600">Red = Loss</span>
        </div>
        <div className="flex items-center gap-2 text-navy-400">
          <Tag className="w-4 h-4" />
          Agent and Customer prices are editable — profits recalculate automatically.
        </div>
      </div>
    </div>
  );
}
