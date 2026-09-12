# emlak-hub-application

Глобальная аналитическая B2B-платформа для инвесторов в недвижимость и авто на госаукционах  
(**Digital Emlak Hub** / **RosAktiv Hub**).

## Архитектура

```
src/
  app/
    layout.js          # SEO + шрифты + оболочка
    page.js            # Лендинг (маркетинг)
    dashboard/page.js  # Вход в закрытый терминал
  components/
    landing/           # Только marketing UI
    dashboard/         # Только platform UI (дальше)
  lib/
    i18n/              # AZ/RU словари и LocaleProvider
```

Лендинг и дашборд разделены специально: SEO/маркетинг не смешивается с продуктовой логикой.

## Запуск

```bash
cd ~/Desktop/emlak-hub-application
npm run dev
```

Открой: [http://localhost:3000](http://localhost:3000)

## Стек

- Next.js (App Router)
- React (JSX, без TypeScript)
- Tailwind CSS v4
- Manrope (Quiet Luxury typography)
