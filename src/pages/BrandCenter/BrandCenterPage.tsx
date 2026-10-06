import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  CheckCircle2,
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
    role: 'Superfícies ativas, ênfases nobres, estados selecionados',
    hex: '#12352B',
    rgb: '18, 53, 43'
  },
  {
    name: 'Ouro Suave / Sand Gold',
    role: 'Indicadores premium, destaques e refinamentos visuais',
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
    hex: '#121A16',
    rgb: '18, 26, 22'
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
    <div style={{ maxWidth: '1220px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Editorial Header */}
      <div
        style={{
          borderBottom: '1px solid var(--cream-border)',
          paddingBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--sand-gold-dark)',
              background: 'var(--sand-gold-tint)',
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            Manual de Identidade & Brandbook Digital
          </span>
        </div>

        <h1
          className="font-serif"
          style={{
            fontSize: '3rem',
            fontWeight: 700,
            color: 'var(--green-deep)',
            letterSpacing: '-0.02em',
            marginTop: '4px'
          }}
        >
          Brand Center
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '720px', lineHeight: 1.6, fontWeight: 450 }}>
          A identidade da Alicerce em um só lugar. Elementos visuais, tom de voz, pilares editoriais e diretrizes oficiais da marca.
        </p>
      </div>

      {/* 1. SEÇÃO LOGO OFICIAL */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            01 • Marca & Símbolo
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            Logo Oficial Alicerce
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', fontWeight: 450 }}>
            A marca oficial da Alicerce possui ligatura proprietária que une precisão arquitetônica e sofisticação editorial.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '28px'
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
              padding: '40px 36px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '26px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: 'var(--sand-gold)',
                    fontWeight: 700
                  }}
                >
                  Aplicação Primária (Fundo Escuro)
                </span>
                <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                  PNG Original de Alta Resolução
                </span>
              </div>

              {/* Centered Logo Preview */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 24px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '24px'
                }}
              >
                <img
                  src="/Ab.png"
                  alt="Logo Oficial Alicerce"
                  style={{
                    maxWidth: '240px',
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>

              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                Versão primordial de contraste, ideal para cabeçalhos escuros, identidades institucionais e ambientes executivos.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '22px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                marginTop: '24px'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                Arquivo: <strong>Ab.png</strong>
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
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '36px' }}>
            <div>
              <span
                style={{
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--sand-gold-dark)',
                  fontWeight: 700
                }}
              >
                Diretrizes de Aplicação
              </span>
              <h3 className="font-serif" style={{ fontSize: '1.55rem', fontWeight: 650, color: 'var(--green-deep)', marginTop: '6px', marginBottom: '16px' }}>
                Integridade Visual e Respiro
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <CheckCircle2 size={18} color="var(--green-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Área de Respiro Mínima:</strong> Manter distância de segurança proporcional à altura da letra "A" em todos os cantos.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <CheckCircle2 size={18} color="var(--green-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Sem Distorções:</strong> A proporção dimensional e a curvatura da ligatura "i-c-e" nunca devem ser modificadas.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <CheckCircle2 size={18} color="var(--green-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Contraste Elegante:</strong> Aplicação recomendada sobre verde profundo Alicerce, fundos escuros refinados ou creme limpo.
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '18px 20px',
                background: 'var(--cream-subtle)',
                borderRadius: 'var(--radius-md)',
                marginTop: '24px',
                borderLeft: '3.5px solid var(--sand-gold)'
              }}
            >
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--green-deep)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                Assinatura Oficial
              </div>
              <div style={{ fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                "Alicerce — A estrutura do seu negócio."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO PALETA CROMÁTICA */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            02 • Cores & Contrastes
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            Paleta Visual Alicerce
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', fontWeight: 450 }}>
            Clique em qualquer card ou no botão correspondente para copiar o código HEX com 1 clique.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '20px'
          }}
        >
          {BRAND_COLORS.map((col) => {
            const isCopied = copiedHex === col.hex;
            return (
              <div
                key={col.hex}
                className="card"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  cursor: 'pointer'
                }}
                onClick={() => handleCopyHex(col.hex)}
              >
                {/* Visual Swatch */}
                <div
                  style={{
                    height: '115px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: col.hex,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-end',
                    padding: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
                  }}
                >
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      fontSize: '0.76rem',
                      padding: '5px 10px',
                      color: '#121A16',
                      fontWeight: 650,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyHex(col.hex);
                    }}
                  >
                    {isCopied ? <Check size={13} color="#15803d" /> : <Copy size={13} />}
                    {isCopied ? 'Copiado!' : 'Copiar HEX'}
                  </button>
                </div>

                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {col.name}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0', lineHeight: 1.45, fontWeight: 450 }}>
                    {col.role}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      paddingTop: '10px',
                      borderTop: '1px solid var(--cream-border-subtle)',
                      marginTop: '10px',
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
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            03 • Tipografia
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            Sistema Tipográfico
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', fontWeight: 450 }}>
            Equilíbrio entre prestígio editorial e clareza funcional de software moderno.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '28px'
          }}
        >
          {/* Montserrat Card */}
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span className="badge badge-service">Títulos, Força & Estrutura</span>
            </div>
            <h3 className="font-heading" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', marginBottom: '8px' }}>
              Montserrat
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '22px', fontWeight: 400 }}>
              Geométrica, imponente e estruturada. Pesos oficiais: 500, 600 e 700. Usada em títulos de página, seções, botões, sidebar, badges e números de KPI.
            </p>

            <div
              style={{
                padding: '22px 24px',
                background: 'var(--cream-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderLeft: '3px solid var(--sand-gold)'
              }}
            >
              <div className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1.25 }}>
                "Estrutura precede o crescimento."
              </div>
              <div className="font-heading" style={{ fontSize: '1rem', color: 'var(--sand-gold-dark)', fontWeight: 600 }}>
                Estratégia sólida para marcas que visam o topo do mercado.
              </div>
            </div>
          </div>

          {/* Poppins Card */}
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span className="badge badge-service">Leitura, Formulários & Suavidade</span>
            </div>
            <h3 className="font-body" style={{ fontSize: '2.1rem', fontWeight: 600, color: 'var(--green-deep)', marginBottom: '8px' }}>
              Poppins
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '22px', fontWeight: 400 }}>
              Sans-serif geométrica com toque humano e alta legibilidade. Pesos oficiais: 400, 500 e 600. Usada em textos corridos, descrições, inputs e cards.
            </p>

            <div
              style={{
                padding: '22px 24px',
                background: 'var(--cream-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                borderLeft: '3px solid var(--green-primary)'
              }}
            >
              <div className="font-heading" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Dashboards, Tabelas, Métricas e Formulários
              </div>
              <div className="font-body" style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 400 }}>
                Desenvolvida para proporcionar leitura fluida, rápida absorção de dados operacionais e extremo conforto visual em sessões prolongadas.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO TOM DE VOZ & POSICIONAMENTO */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            04 • Voz & Posicionamento
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            Tom de Voz Alicerce
          </h2>
        </div>

        {/* 5 Tone Traits */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '18px'
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
                padding: '24px 20px',
                borderTop: '3.5px solid var(--sand-gold)'
              }}
            >
              <h4 className="font-serif" style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--green-deep)', marginBottom: '8px' }}>
                {item.word}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 450 }}>
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
            padding: '40px',
            border: '1px solid var(--sand-gold)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--sand-gold)', fontWeight: 700, marginBottom: '10px' }}>
            Posicionamento Institucional
          </div>

          <h3
            className="font-serif"
            style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '14px',
              lineHeight: 1.25
            }}
          >
            A Alicerce não é apenas uma agência.
          </h3>

          <p
            style={{
              fontSize: '1.2rem',
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.6,
              maxWidth: '840px',
              fontWeight: 450
            }}
          >
            A Alicerce estrutura marcas, presença, aquisição e comunicação para negócios que querem crescer com base.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              marginTop: '28px',
              padding: '12px 22px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(197, 168, 128, 0.16)',
              border: '1px solid var(--sand-gold)'
            }}
          >
            <span className="font-serif" style={{ fontSize: '1.3rem', color: '#ffffff', fontWeight: 700 }}>
              Alicerce
            </span>
            <span style={{ color: 'var(--sand-gold)', fontSize: '0.9rem' }}>•</span>
            <span style={{ color: 'var(--sand-gold-light)', fontSize: '0.94rem', fontWeight: 600 }}>
              A estrutura do seu negócio.
            </span>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DIREÇÃO EDITORIAL (OS 4 PILARES) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sand-gold-dark)' }}>
            05 • Conteúdo & Matriz de Produção
          </span>
          <h2 className="font-serif" style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            Direção Editorial Alicerce
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', fontWeight: 450 }}>
            Modelo: <strong>Editorial + Infotainment + Social-first</strong>
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '22px'
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
                padding: '26px'
              }}
            >
              <div>
                <div
                  className="font-serif"
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--sand-gold-dark)',
                    lineHeight: 1,
                    marginBottom: '12px'
                  }}
                >
                  {pillar.num}
                </div>
                <h3
                  className="font-serif"
                  style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}
                >
                  {pillar.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55, fontWeight: 450 }}>
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
