# Consistency Check

## Visual continuity
- [x] Контейнеры и отступы следуют исходным 16/20/24/32 px ритмам.
- [x] Иерархия Geist/Inter/JetBrains Mono сохранена локальными шрифтами.
- [x] Палитра поверхностей, зелёный primary и золотой level accent сохранены.
- [x] Радиусы, границы, карточки, таблицы и CTA соответствуют исходным макетам.
- [x] Новые спортивные страницы используют существующие pattern families.

## Component and token continuity
- [x] Public/User/Admin shell, navigation, cards, badges, controls и domain blocks переиспользуются.
- [x] Цвета и базовые размеры централизованы в CSS variables и Tailwind config.
- [x] CDN и удалённые изображения отсутствуют.

## Responsive and accessibility
- [x] Sidebar заменяется на keyboard-accessible mobile drawer.
- [x] Проверены 390, 1280 и desktop browser presets; горизонтального overflow нет.
- [x] Семантика headings, tables, labels, progressbar, dialog и button/link сохранена.
- [x] Focus states и reduced-motion предусмотрены.

## Code quality and AI-smell filter
- [x] Нет дублирующихся page shells или прямой DOM-мутации.
- [x] Нет новых случайных цветов, radius systems, glassmorphism или generic SaaS-блоков.
- [x] Typecheck, lint, unit/component tests, E2E и production build проходят.

Невыполненных пунктов не осталось.
