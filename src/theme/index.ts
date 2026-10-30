// Tokens do design system "Predictive Intercity Mobility" (docs/DESIGN.md),
// conferidos com o protótipo do Stitch. Use sempre estes valores nas telas.

export const cores = {
  // Índigo: ações principais e de IA (Entrar, Buscar, Interpretar, Solicitar vaga).
  primaria: '#6366F1',
  primariaEscura: '#4F46E5',
  primariaSuave: '#EEF0FF',
  primariaBorda: 'rgba(99, 102, 241, 0.25)',
  // Esmeralda: confirmações, seleção, preços e marca.
  verde: '#047857',
  verdeSuave: '#D1FAE5',
  secundaria: '#1E3A8A', // confiança, perfis verificados
  sucesso: '#059669',
  sucessoSuave: '#D1FAE5',
  erro: '#BA1A1A',
  erroSuave: '#FFE4E1',
  aviso: '#B45309',
  avisoSuave: '#FEF3C7',
  estrela: '#F59E0B',

  fundo: '#F5F6FE',
  superficie: '#FFFFFF',
  superficieAlt: '#F0F1FD',
  borda: '#E4E7F5',
  bordaForte: '#C7CBE6',
  texto: '#0F172A',
  textoSecundario: '#64748B',
  textoSobrePrimaria: '#FFFFFF',
};

export const fontes = {
  titulo: 'SpaceGrotesk_600SemiBold',
  tituloForte: 'SpaceGrotesk_700Bold',
  corpo: 'HankenGrotesk_400Regular',
  corpoMedio: 'HankenGrotesk_500Medium',
  rotulo: 'HankenGrotesk_600SemiBold',
};

export const tipografia = {
  display: { fontFamily: fontes.tituloForte, fontSize: 30, lineHeight: 38 },
  tituloG: { fontFamily: fontes.tituloForte, fontSize: 26, lineHeight: 32 },
  tituloM: { fontFamily: fontes.titulo, fontSize: 22, lineHeight: 28 },
  tituloP: { fontFamily: fontes.titulo, fontSize: 18, lineHeight: 24 },
  numero: { fontFamily: fontes.tituloForte, fontSize: 24, lineHeight: 30 },
  corpo: { fontFamily: fontes.corpo, fontSize: 16, lineHeight: 24 },
  corpoG: { fontFamily: fontes.corpo, fontSize: 18, lineHeight: 28 },
  rotulo: { fontFamily: fontes.rotulo, fontSize: 16, lineHeight: 22 },
  rotuloP: { fontFamily: fontes.rotulo, fontSize: 14, lineHeight: 20 },
  legenda: { fontFamily: fontes.corpoMedio, fontSize: 13, lineHeight: 18 },
} as const;

export const espaco = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const raio = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  total: 9999,
};

export const sombra = {
  cartao: {
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  destaqueIA: {
    shadowColor: '#6366F1',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
};

// Altura mínima de toque (DESIGN.md: 48–56px).
export const alturaToque = 52;
