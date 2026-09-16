# Winkkit

Winkkit is a production-oriented local commerce and delivery platform foundation built with Expo SDK 54, React Native, TypeScript, NativeWind, tRPC, Drizzle, MySQL/TiDB, and Manus OAuth.

## What is implemented

The current release includes a branded customer mobile experience with safe-area-aware navigation for Home, Search, Orders, Cart, and Account; server-backed shop and product discovery; persistent cart state; authenticated checkout and order creation; transactional inventory decrementing; order history; role-aware operator queues for shopkeepers, delivery partners, and administrators; controlled order-status transitions; and an admin operational summary that calculates gross order value and commission from persisted order data.

The backend schema includes users, configurable categories, addresses, shops, products, orders, order items, and settlement entries. The order engine validates availability and inventory in a database transaction and records commission and delivery-earnings fields for settlement processing.

## Production gates still required

This repository does **not** claim that live money movement or a signed distributable APK is configured yet. Before accepting real payments, configure and review a payment processor integration and webhook verification in the server environment. Before publishing an APK, configure an Expo/EAS account or `EXPO_TOKEN`, Android signing credentials, a production API URL, and push-notification credentials. The checkout UI explicitly prevents the project from silently representing pending payment as completed payment.

The repository was initialized from an empty GitHub repository, so the project source is the first complete commit for Winkkit.

## Development

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

The Vitest suite covers the unauthenticated order boundary, empty-cart validation, role-gated operational access, and admin summary contract. The existing scaffold auth test remains skipped because it is a template placeholder.

## Android APK profile

`eas.json` contains a `preview` profile configured for an installable Android APK:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The current sandbox could not start this build because no Expo/EAS credential was available.

## Brand

Winkkit uses the requested primary palette: royal blue `#3157D5`, deep navy `#111A3A`, aqua `#20C7B5`, background `#F7F9FC`, and a restrained semantic status palette. The generated Winkkit mark is stored in `assets/images/winkkit-icon.png` and is used as the application icon and splash artwork.
