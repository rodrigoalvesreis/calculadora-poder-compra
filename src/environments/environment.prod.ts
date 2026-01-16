
export const environment = {
  production: false,
  prazoAnos: 35,

  faixas: [
    {
      id: 1,
      limiteRenda: 2160,
      limiteImovel: 210000,
      taxaEfetiva: 0.048548,
    },
    {
      id: 2,
      limiteRenda: 2850,
      limiteImovel: 210000,
      taxaEfetiva: 0.051162,
    },
    {
      id: 3,
      limiteRenda: 3500,
      limiteImovel: 210000,
      taxaEfetiva: 0.056408,
    },
    {
      id: 4,
      limiteRenda: 4000,
      limiteImovel: 210000,
      taxaEfetiva: 0.061678,
    },
    {
      id: 5,
      limiteRenda: 4700,
      limiteImovel: 210000,
      taxaEfetiva: 0.072290,
    },
    {
      id: 6,
      limiteRenda: 8600,
      limiteImovel: 350000,
      taxaEfetiva: 0.085722,
    },
    {
      id: 7,
      limiteRenda: 12000,
      limiteImovel: 500000,
      taxaEfetiva: 0.10,
    },
    {
      id: 8, // taxa balcão
      limiteRenda: Number.MAX_SAFE_INTEGER,
      limiteImovel: Number.MAX_SAFE_INTEGER,
      taxaEfetiva: 0.1149
    },
  ],
};
