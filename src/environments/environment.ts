
export const environment = {
  production: false,

  faixas: [
    {
      id: 1,
      limiteRenda: 2160,
      limiteImovel: 210000,
      taxaNominal: 0.0475,
    },
    {
      id: 2,
      limiteRenda: 2850,
      limiteImovel: 210000,
      taxaNominal: 0.05,
    },
    {
      id: 3,
      limiteRenda: 3500,
      limiteImovel: 210000,
      taxaNominal: 0.055,
    },
    {
      id: 4,
      limiteRenda: 4000,
      limiteImovel: 210000,
      taxaNominal: 0.06,
    },
    {
      id: 5,
      limiteRenda: 4700,
      limiteImovel: 210000,
      taxaNominal: 0.07,
    },
    {
      id: 6,
      limiteRenda: 8600,
      limiteImovel: 350000,
      taxaNominal: 0.0816,
    },
    {
      id: 7,
      limiteRenda: 12000,
      limiteImovel: 500000,
      taxaNominal: 0.10,
    },
    {
      id: 8, // taxa balcão
      limiteRenda: Number.MAX_SAFE_INTEGER,
      limiteImovel: Number.MAX_SAFE_INTEGER,
      taxaNominal: 0.1149
    },
  ],
};
