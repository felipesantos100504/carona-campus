// Tokens do design system "Predictive Campus Mobility" (docs/DESIGN.md).
// Use sempre estes valores nas telas em vez de cores e tamanhos soltos.

export const cores = {
  primaria: '#6366F1', // ações de IA, destaques, botões principais
  primariaSuave: 'rgba(99, 102, 241, 0.10)',
  primariaBorda: 'rgba(99, 102, 241, 0.25)',
  secundaria: '#1E3A8A', // confiança, perfis verificados
  sucesso: '#059669', // confirmações, status ok
  sucessoSuave: 'rgba(5, 150, 105, 0.10)',
  erro: '#BA1A1A',
  erroSuave: '#FFDAD6',
  aviso: '#B45309',
  avisoSuave: '#FEF3C7',

  fundo: '#F8FAFC',
  superficie: '#FFFFFF',
  superficieAlt: '#F1F5F9',
  borda: '#E2E8F0',
  bordaForte: '#CBD5E1',
  texto: '#0F172A',
  textoSecundario: '#64748B',
  textoSobrePrimaria: '#FFFFFF',
};

export const fontes = {
  titulo: 'Outfit_600SemiBold',
  tituloForte: 'Outfit_700Bold',
  corpo: 'HankenGrotesk_400Regular',
  corpoMedio: 'HankenGrotesk_500Medium',
  rotulo: 'HankenGrotesk_600SemiBold',
};

export const tipografia = {
  display: { fontFamily: fontes.tituloForte, fontSize: 30, lineHeight: 38 },
  tituloG: { fontFamily: fontes.titulo, fontSize: 26, lineHeight: 34 },
  tituloM: { fontFamily: fontes.titulo, fontSize: 22, lineHeight: 30 },
  tituloP: { fontFamily: fontes.titulo, fontSize: 18, lineHeight: 26 },
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
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  total: 9999,
};

export const sombra = {
  cartao: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
