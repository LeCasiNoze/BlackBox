# BlackBox — Design System (« champagne nocturne »)

Référence des tokens, classes et règles visuelles. Source de vérité : la valeur
dans [`web/src/index.css`](src/index.css) prime toujours sur ce document — si tu
modifies un token là-bas, mets cette fiche à jour.

## 1. Thèmes (3 profils, 2 identités)

| Profil       | Identité      | Mécanisme                                  |
|--------------|---------------|--------------------------------------------|
| BBX (standard) | Or champagne | `:root` (défaut)                          |
| Fondateur    | Or champagne  | `:root` (défaut)                           |
| Pro (B2B)    | Acier (steel) | `[data-theme="pro"]` override l'accent     |

L'accent est piloté par variables, donc une même classe (`.bb-text-gold`,
`.bb-button-brand`, `.bb-gold-frame`) bascule automatiquement en acier sous
`[data-theme="pro"]`. Ne jamais coder une couleur d'accent en dur.

## 2. Couleurs (tokens `--bb-*`)

**Fonds & surfaces**
- `--bb-bg` `#14110d` · `--bb-bg-deep` `#0c0a07`
- `--bb-surface` `rgba(32,27,20,.6)` · `--bb-surface-2` `rgba(40,34,25,.74)` · `--bb-surface-strong` `rgba(26,21,15,.86)`
- `--bb-border` `rgba(247,235,210,.1)` · `--bb-border-strong` `rgba(232,201,138,.22)`

**Texte**
- `--bb-copy` `#f4ede0` (corps) · `--bb-muted` `#b3a48d` (secondaire)

**Accent OR (défaut)**
- `--bb-accent` `#e8c98a` · `--bb-accent-soft` `#ffd87a` · `--bb-accent-strong` `#d99a4e`
- `--bb-accent-rgb` `232 201 138` (pour `rgb(var(--bb-accent-rgb)/ .5)` + couleur Tailwind `accent`)
- `--bb-ring-gold` `rgba(232,201,138,.55)`

**Accent ACIER (`[data-theme="pro"]` + tokens steel globaux)**
- `--bb-steel` `#4cc6ff` · `--bb-steel-strong` `#1f8fd6`

**États**
- `--bb-success` `#43d79d` · `--bb-danger` `#ff7d89`

## 3. Typographie

- Import Google Fonts en tête d'`index.css` : **Plus Jakarta Sans** (400–800) + **Manrope** (400–700).
- Stack : `"Plus Jakarta Sans", "Manrope", "Segoe UI", sans-serif`.
- Titres = `.bb-display` (letter-spacing `-0.022em`).

| Classe          | Usage                          | Détail                                   |
|-----------------|--------------------------------|------------------------------------------|
| `.bb-title`     | Titre de section               | 2rem → 3.25rem md, bold, leading 1.02    |
| `.bb-title-xl`  | Hero                           | 2.5rem → 4.25rem md, extrabold           |
| `.bb-display`   | Base titres                    | tracking serré                           |
| `.bb-eyebrow`   | Sur-titre or                   | 11px, uppercase, tracking `0.26em`       |
| `.bb-eyebrow-steel` | Sur-titre acier            | idem en acier                            |
| `.bb-subtitle`  | Paragraphe secondaire          | `--bb-muted`, leading 7                   |
| `.bb-text-gold` / `.bb-text-steel` | Texte en dégradé clip | réservé aux accents, pas au corps      |

## 4. Surfaces, cadres & rayons

- `.bb-surface` — verre champagne, `rounded-[26px]`, `backdrop-blur-xl`, ombre profonde.
- `.bb-surface-strong` — version dense, `rounded-[30px]`, `backdrop-blur-2xl`.
- `.bb-hairline` — carte légère `rounded-2xl`.
- `.bb-gold-frame` / `.bb-steel-frame` — liseré dégradé 1px en surcouche (`::after` masqué), n'altère pas le fond verre. Hérite du `border-radius` du parent.
- Rayons usuels : cartes 26–30px, inputs `rounded-2xl`, pills & boutons `rounded-full`.

## 5. Composants

**Boutons** (tous `rounded-full`, hover `-translate-y-0.5`)
- `.bb-button-brand` — CTA principal, dégradé or + reflet « shine » animé (`::after`).
- `.bb-button-steel` — CTA acier (univers pro).
- `.bb-button-ghost` — secondaire, bordure verre.
- `.bb-button-danger` — destructif, rose.

**Formulaires** : `.bb-input` / `.bb-textarea` / `.bb-select` — fond `white/[.025]`, focus → bordure + ring `accent/25`.

**Divers** : `.bb-pill` (badge uppercase), `.bb-metric` (carte chiffre avec liseré top), `.bb-section-head` (en-tête flex), `.bb-shell` + `.bb-content` (gabarit de page, `max-w-7xl`).

**Héros & orbes** : `.bb-founder-hero` / `.bb-pro-hero` (fonds radiaux) + orbes décoratifs `.bb-founder-orb-*`, `.bb-pro-orb-*`.

## 6. Mouvement

- Fond : aurore chaude animée `html::before` (`@keyframes bb-aurora`, 26s).
- Entrées : `.bb-rise`, `.bb-rise-2/3/4` (apparition décalée), `.bb-backdrop-in`, `.bb-modal-panel`.
- Interactions : `.bb-hover-lift`, reflet « shine » sur boutons, `.bb-attention-ring` / `.bb-attention-nudge`.
- Festif : `.bb-confetti-piece`, `.bb-event-glow`.
- **Framer Motion** est désormais installé (`framer-motion`) pour les transitions
  React avancées (page transitions, `AnimatePresence`, gestes). Respecter la règle perf ci-dessous.

## 7. Règle perf mobile (NON négociable)

En bas d'`index.css`, sous `@media (max-width: 767px)` : **pas de `backdrop-filter`**,
fond non `fixed`, animations en pause. Toute nouvelle surface en verre ou animation
doit avoir son fallback mobile dans ce bloc.

## 8. Outillage design disponible

- **Playwright MCP** — boucle visuelle : rendre une vue, screenshoter, corriger.
- **Magic MCP (21st.dev)** — génération/raffinage de composants + recherche de logos.
- **Skill `ui-ux-pro-max`** — styles, palettes, pairings de polices, règles UX.
- **`framer-motion`** + **`lucide-react`** (icônes) installés dans `web/`.
