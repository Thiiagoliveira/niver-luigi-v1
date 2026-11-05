# A aventura do Luigi

Experiência visual de aniversário em **Angular 19, TypeScript, HTML e SCSS**. Duas fases de papel recortado, empilhadas verticalmente, com uma câmera sticky e movimento controlado pelo scroll. Sem navegação entre páginas, Canvas ou motor de jogos.

## Executar

Requer Node.js **22.0+** (verificado com 22.11) ou 20.11+ e npm.

```sh
npm ci
npm start
```

Abra http://localhost:4200. Role com mouse, touchpad, toque ou teclado. Os controles de capítulos e os pontos no rodapé percorrem a mesma sequência de scroll. O logo retorna ao início.

```sh
npm run build
```

A versão de produção fica em `dist/luigi/browser/`. Imagens, fontes e sprites são locais; a experiência não busca recursos externos durante o uso.

## Organização

- `src/app/birthday/birthday-page.component.*`: página, controles e leitura de scroll, organizada com `requestAnimationFrame` e listeners passivos.
- `src/app/birthday/journey.ts`: coreografia pura em progresso de 0 a 1, incluindo posições, saltos, entrada, câmera, saída e caminhada final.
- `components/luigi-character/`: atlas local, seleção de quadros, direção e recorte progressivo por `clip-path`.
- `components/green-pipe/`: fundo/abertura atrás do personagem e borda/corpo na frente, com a mesma linha de oclusão do recorte.
- `components/paper-cut-scene/`: céu, nuvens, montanhas, colinas, terreno e decoração com diferentes intensidades de parallax.
- `src/assets/luigi/`: atlas, quadros originais e metadados da seleção.
- `src/assets/scenes/`: textura de papel e favicon. A paisagem é construída localmente em HTML/CSS/SVG.
- `src/assets/fonts/`: fontes Fraunces e Nunito, acompanhadas de suas licenças OFL.

## Como a sequência funciona

| Progresso | Ação |
| --- | --- |
| 0–3,5% | Luigi parado no lado esquerdo |
| 3,5–30% | Caminhada até o cano |
| 30–36,5% | Salto para alinhar os pés à abertura |
| 36,5–39,5% | Pequena pausa sobre a abertura |
| 39,5–47% | Descida vertical, encoberta gradualmente pelo cano |
| 49–65% | Câmera desce uma altura de tela, revelando a fase de baixo |
| 67–74,5% | Luigi sobe de dentro do cano da festa |
| 76–81,5% | Salto de saída até o chão |
| 81,5–98% | Caminhada para a direita |
| 98–100% | Chegada à festa |

Posições e quadros são funções do progresso, sem acumular movimento por tempo. A rolagem inversa refaz o trajeto. O `requestAnimationFrame` só aplica o estado e restaura a pose de repouso quando o scroll para; nenhum timer avança a aventura. Durante o movimento de câmera, os dois personagens estão integralmente recortados dentro dos canos.

O controle **Parallax ativado / Menos movimento** desativa os deslocamentos decorativos. `prefers-reduced-motion` já inicia nesse modo e remove a rolagem suave dos atalhos. A narrativa continua disponível pelo scroll.

## Sprites e créditos

Sprites originais de Luigi de *Paper Mario: The Origami King*, da Nintendo, fornecidos pela [referência solicitada no The Spriters Resource](https://www.spriters-resource.com/nintendo_switch/papermariotheorigamiking/asset/136282/). Pacote publicado por **Fawfulthegreat64**, com contribuição de **Penky**.

O pacote foi examinado por uma folha de contato dos quadros individuais. Não foi presumida uma animação pronta: foram selecionadas as poses de `Individual frames/1/R/`:

- `0027`: repouso;
- `0030` a `0035`: seis poses para o ciclo de caminhada;
- `0121`: pose frontal para os canos;
- `0115`: chegada/comemoração.

Os PNGs originais são preservados em `src/assets/luigi/originals/`. O atlas remove somente margens transparentes e alinha os pés em células de 160 × 272 px, sem redesenhar ou redimensionar a arte. Os quadros dessa pasta olham para a esquerda; a direção para a direita usa espelhamento horizontal no CSS. `frames.json` registra os arquivos e índices.

Para reconstruir o atlas a partir do ZIP original (opcional; os arquivos prontos já estão no projeto):

```sh
python -m pip install pillow
python scripts/prepare-sprites.py caminho/para/136282.zip
```

## Verificar

```sh
npm test
```

13 testes verificam continuidade em todas as fronteiras de etapa, oclusão parcial e completa, ausência do personagem durante a câmera, reversibilidade e limites de scroll em quatro dimensões de tela.

Para o teste de integração, mantenha `npm start` em outro terminal:

```sh
npx playwright install chromium
npm run test:browser
```

O teste usa Chromium isolado em 1440 × 900, 390 × 844 e 320 × 568. Verifica sprites/fontes, scroll real com roda do mouse e gesto de toque emulado, repouso ao parar, direção ao voltar, máscaras, posição da câmera, saída, atalhos, largura da página e redução de movimento. Capturas das etapas ficam em `test-results/`.

O teste móvel cobre dimensões responsivas; a interação por toque deve ser conferida também no dispositivo desejado. Não há informações definitivas da festa, RSVP ou backend nesta etapa.
