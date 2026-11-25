import type { RevisaoTexto } from '@/data/ia';

import { Aviso } from './aviso';

type Props = {
  revisao: RevisaoTexto;
  /** Texto do botão que publica sem corrigir (ex.: "Publicar mesmo assim"). */
  acao: string;
};

/** Avisos da revisão de texto (RF-19): a pessoa corrige ou segue mesmo assim. */
export function AvisoRevisao({ revisao, acao }: Props) {
  const origem =
    revisao.fonte === 'ia'
      ? 'Conferido pela IA.'
      : 'IA indisponível: conferimos só telefone, e-mail, documentos e links.';
  return (
    <Aviso titulo="Revise o texto antes de continuar" icone="shield-checkmark-outline">
      {revisao.problemas.map((p) => `• ${p}`).join('\n')}
      {`\n\nCorrija o texto ou toque em "${acao}". ${origem}`}
    </Aviso>
  );
}
