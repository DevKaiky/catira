const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const data = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function formatarMoeda(valor: number): string {
  return moeda.format(valor);
}

export function formatarData(isoDate: string): string {
  return data.format(new Date(isoDate));
}

export const TIPO_VEICULO_LABEL: Record<string, string> = {
  carro: "Carro",
  moto: "Moto",
  caminhonete: "Caminhonete",
  outro: "Outro",
};

export const TIPO_NEGOCIACAO_LABEL: Record<string, string> = {
  compra: "Compra",
  venda: "Venda",
  troca: "Troca",
};
