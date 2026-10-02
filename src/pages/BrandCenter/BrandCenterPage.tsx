import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Layers,
  Type,
  Compass,
  BookOpen,
  Feather,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../../components/Common/Toast';

interface ColorSwatch {
  name: string;
  role: string;
  hex: string;
  rgb: string;
  isDarkText?: boolean;
}

const BRAND_COLORS: ColorSwatch[] = [
  {
    name: 'Verde Profundo Alicerce',
    role: 'Sidebar, botões primários, elementos de autoridade máxima',
    hex: '#0B221B',
    rgb: '11, 34, 27'
  },
  {
    name: 'Verde Alicerce Primário',
    role: 'Superfícies, ênfases nobres, estados ativos',
    hex: '#12352B',
    rgb: '18, 53, 43'
  },
  {
    name: 'Ouro Suave / Sand Gold',
    role: 'Indicadores premium, destaques e refinamentos',
    hex: '#C5A880',
    rgb: '197, 168, 128',
    isDarkText: true
  },
  {
    name: 'Champagne / Dourado Claro',
    role: 'Fundos de apoio, badges e realces sutis',
    hex: '#DFCEB7',
    rgb: '223, 206, 183',
    isDarkText: true
  },
  {
    name: 'Creme / Off-white Principal',
    role: 'Background geral da plataforma e áreas de leitura',
    hex: '#FAF8F5',
    rgb: '250, 248, 245',
    isDarkText: true
  },
  {
    name: 'Areia Suave / Superfície',
    role: 'Containers, bordas e cartões de apoio',
    hex: '#F3EFEA',
    rgb: '243, 239, 234',
    isDarkText: true
  },
  {
    name: 'Grafite Editorial',
    role: 'Textos de leitura, contraste e legibilidade',
    hex: '#18201D',
    rgb: '24, 32, 29'
  }
];

export const BrandCenterPage: React.FC = () => {
  const { showToast } = useToast();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    showToast(`Código ${hex} copiado para a área de transferência!`, 'success');
    setTimeout(() => setCopiedHex(null), 2500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* Editorial Header */}
      <div
        style={{
          borderBottom: '1px solid var(--cream-border)',
          paddingBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--sand-gold-dark)',
              background: 'var(--sand-gold-tint)',
              padding: '3px 12px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            Brand Guidelines & Ativos
          </span>
        </div>

        <h1
          className="font-serif"
          style={{
            fontSize: '2.8rem',
            fontWeight: 700,
            color: 'var(--green-deep)',
            letterSpacing: '-0.02em',
            marginTop: '4px'
          }}
        >
          Brand Center
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '680px' }}>
          A identidade da Alicerce em um só lugar. Elementos visuais, tom de voz, pilares editoriais e diretrizes oficiais da marca.
        </p>
      </div>

      {/* 1. SEÇÃO LOGO OFICIAL */}
      <section>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            01 • Marca & Símbolo
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
            Logo Oficial Alicerce
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            A marca oficial da Alicerce possui ligatura proprietária que une precisão arquitetônica e sofisticação editorial.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}
        >
          {/* Main Dark Card with Original Logo */}
          <div
            className="card"
            style={{
              background: '#071712',
              color: '#FAF8F5',
              border: '1px solid var(--sand-gold-dark)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '36px 32px'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--sand-gold)',
                    fontWeight: 700
                  }}
                >
                  Aplicação Master (Fundo Escuro)
                </span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                  PNG Original
                </span>
              </div>

              {/* Centered Logo Preview */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '36px 20px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: '20px'
                }}
              >
                <img
                  src="/Ab.png"
                  alt="Logo Oficial Alicerce"
                  style={{
                    maxWidth: '220px',
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>

              <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                Versão primordial de contraste, ideal para painéis, cabeçalhos escuros, identidades institucionais e ambientes executivos.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                marginTop: '20px'
              }}
            >
              <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)' }}>
                Arquivo: Ab.png
              </span>
              <a
                href="/Ab.png"
                download="Alicerce_Logo_Oficial.png"
                className="btn btn-gold btn-sm"
                style={{ gap: '6px' }}
              >
                <Download size={14} /> Baixar Ativo Original
              </a>
            </div>
          </div>

          {/* Guidelines on Safe Area & Rules */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px' }}>
            <div>
              <span
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--sand-gold-dark)',
                  fontWeight: 700
                }}
              >
                Diretrizes de Aplicação
              </span>
              <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--green-deep)', marginTop: '4px', marginBottom: '14px' }}>
                Integridade e Área de Respiro
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sand-gold)', marginTop: '8px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Área de Respiro Mínima:</strong> Manter distância de segurança equivalente à altura da letra "A" em todos os quatro cantos.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sand-gold)', marginTop: '8px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Não Distorcer:</strong> A proporção de largura e altura da logo oficial nunca deve ser alterada.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sand-gold)', marginTop: '8px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Contraste Rigoroso:</strong> Aplicar exclusivamente sobre o verde profundo Alicerce, fundos pretos elegantes ou off-white límpido.
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'var(--cream-subtle)',
                borderRadius: 'var(--radius-md)',
                marginTop: '20px',
                borderLeft: '3px solid var(--sand-gold)'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--green-deep)', textTransform: 'uppercase', marginBottom: '2px' }}>
                Assinatura Oficial
              </div>
              <div style={{ fontStyle: 'italic', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                "Alicerce — A estrutura do seu negócio."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO PALETA CROMÁTICA */}
      <section>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            02 • Cores & Contrastes
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
            Paleta Visual Alicerce
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Clique em qualquer cor para copiar imediatamente o código HEX.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '18px'
          }}
        >
          {BRAND_COLORS.map((col) => {
            const isCopied = copiedHex === col.hex;
            return (
              <div
                key={col.hex}
                className="card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => handleCopyHex(col.hex)}
              >
                {/* Visual Swatch */}
                <div
                  style={{
                    height: '110px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: col.hex,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-end',
                    padding: '10px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
                  }}
                >
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      fontSize: '0.72rem',
                      padding: '4px 8px',
                      color: '#18201D',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyHex(col.hex);
                    }}
                  >
                    {isCopied ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                    {isCopied ? 'Copiado!' : 'Copiar HEX'}
                  </button>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {col.name}
                    </h4>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0' }}>
                    {col.role}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--cream-border-subtle)',
                      marginTop: '8px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <span>{col.hex}</span>
                    <span>RGB({col.rgb})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SEÇÃO TIPOGRAFIA */}
      <section>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            03 • Tipografia
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
            Sistema Tipográfico
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Equilíbrio entre prestígio editorial e clareza funcional de software moderno.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px'
          }}
        >
          {/* Serif Card */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-service">Institucional & Títulos</span>
            </div>
            <h3 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--green-deep)', marginBottom: '8px' }}>
              Cormorant Garamond
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Serif clássica, refinada e imponente. Usada em títulos nobres, citações, manifestos e capas editoriais.
            </p>

            <div
              style={{
                padding: '20px',
                background: 'var(--cream-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1.2 }}>
                "Estrutura precede o crescimento."
              </div>
              <div className="font-serif" style={{ fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--sand-gold-dark)' }}>
                Estratégia sólida para marcas que visam o topo do mercado.
              </div>
            </div>
          </div>

          {/* Sans-serif Card */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-service">Interface & Operação</span>
            </div>
            <h3 className="font-sans" style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--green-deep)', marginBottom: '8px' }}>
              Plus Jakarta Sans
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Sans-serif moderna de alta legibilidade, geometria equilibrada e precisão cirúrgica em todas as resoluções.
            </p>

            <div
              style={{
                padding: '20px',
                background: 'var(--cream-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Dashboards, Tabelas, Métricas e Formulários
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Desenvolvida para proporcionar leitura fluida, rápida absorção de dados complexos e conforto visual prolongado.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO TOM DE VOZ & POSICIONAMENTO */}
      <section>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            04 • Voz & Posicionamento
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
            Tom de Voz Alicerce
          </h2>
        </div>

        {/* 5 Tone Traits */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          {[
            { word: 'Claro', desc: 'Sem rodeios. Diz exatamente o que é relevante para o negócio.' },
            { word: 'Estratégico', desc: 'Cada ação tem causa, métrica e objetivo financeiro calculado.' },
            { word: 'Elegante', desc: 'Vocabulário polido, postura refinada e respeito à inteligência do cliente.' },
            { word: 'Objetivo', desc: 'Foco nos ponteiros que movem receita, conversão e percepção.' },
            { word: 'Provocativo', desc: 'Desafia o senso comum com autoridade e embasamento quando necessário.' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: '20px',
                borderTop: '3px solid var(--sand-gold)'
              }}
            >
              <h4 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green-deep)', marginBottom: '6px' }}>
                {item.word}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Master Positioning Card */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #0B221B 0%, #12352B 100%)',
            color: '#FAF8F5',
            padding: '36px',
            border: '1px solid var(--sand-gold)'
          }}
        >
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--sand-gold)', fontWeight: 700, marginBottom: '8px' }}>
            Posicionamento Institucional
          </div>

          <h3
            className="font-serif"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '14px',
              lineHeight: 1.2
            }}
          >
            A Alicerce não é apenas uma agência.
          </h3>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
              maxWidth: '820px'
            }}
          >
            A Alicerce estrutura marcas, presença, aquisição e comunicação para negócios que querem crescer com base.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '24px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(197, 168, 128, 0.15)',
              border: '1px solid var(--sand-gold)'
            }}
          >
            <span className="font-serif" style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
              Alicerce
            </span>
            <span style={{ color: 'var(--sand-gold)', fontSize: '0.85rem' }}>•</span>
            <span style={{ color: 'var(--sand-gold-light)', fontSize: '0.88rem' }}>
              A estrutura do seu negócio.
            </span>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DIREÇÃO EDITORIAL (OS 4 PILARES) */}
      <section>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            05 • Conteúdo & Matriz de Produção
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
            Direção Editorial Alicerce
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Modelo: <strong>Editorial + Infotainment + Social-first</strong>
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}
        >
          {[
            {
              num: '01',
              title: 'Notícia / Atualidade',
              desc: 'O que mudou no mercado e por que isso importa para empresas e empresários.'
            },
            {
              num: '02',
              title: 'Curiosidade / Case',
              desc: 'Marcas, campanhas icônicas, empresas e movimentos do mercado que ensinam algo memorável.'
            },
            {
              num: '03',
              title: 'Educação',
              desc: 'Estratégia, marketing, presença digital, conversão e princípios práticos de crescimento.'
            },
            {
              num: '04',
              title: 'Institucional',
              desc: 'Pensamento, bastidores, projetos, serviços e a visão de longo prazo da Alicerce.'
            }
          ].map((pillar) => (
            <div
              key={pillar.num}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px'
              }}
            >
              <div>
                <div
                  className="font-serif"
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: 'var(--sand-gold-dark)',
                    lineHeight: 1,
                    marginBottom: '10px'
                  }}
                >
                  {pillar.num}
                </div>
                <h3
                  className="font-serif"
                  style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}
                >
                  {pillar.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {pillar.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
