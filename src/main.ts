import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Body size limits (safe defaults for small instances)
  app.use(json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
  app.use(urlencoded({ limit: process.env.FORM_BODY_LIMIT || '1mb', extended: true }));

  // CORS: allow-all toggle for temporary testing/staging (e.g., Vercel frontends before domains are known)
  const allowAllCors = ['1', 'true', 'yes', 'on'].includes(
    (process.env.CORS_ALLOW_ALL || '').toLowerCase(),
  );
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowAllCors) {
    // Reflect request origin, effectively allowing all
    app.enableCors({ origin: true });
  } else if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins });
  } else {
    // Default to permissive during local dev if nothing configured
    app.enableCors({ origin: true });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Simple request id middleware (if client doesn't send x-request-id)
  app.use(
    (
      req: import('express').Request,
      _res: import('express').Response,
      next: import('express').NextFunction,
    ) => {
      if (!req.headers['x-request-id']) {
        // naive id for tracing
        req.headers['x-request-id'] = Math.random().toString(36).slice(2);
      }
      next();
    },
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const swaggerServer = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

  const config = new DocumentBuilder()
    .setTitle('Dentistry Shop API')
    .setDescription('Public and Admin API for dentistry e-commerce')
    .setVersion('0.1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Admin API key for /admin endpoints',
      },
      'x-api-key',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Admin JWT (for future use if needed)',
      },
      'bearer',
    )
    .addServer(swaggerServer)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Serve static assets for Swagger (themes, logos) under /docs-assets
  app.use('/docs-assets', express.static(path.resolve(process.cwd(), 'public')));

  // Swagger theme selection: allow override via env
  // 1) SWAGGER_CSS_URL=/docs-assets/swagger-dark-monokai.css (absolute URL or path)
  // 2) SWAGGER_THEME=monokai|dracula|default (maps to files in /public)
  const swaggerThemeFromEnv = process.env.SWAGGER_THEME?.toLowerCase();
  let customCssUrl = process.env.SWAGGER_CSS_URL;
  if (!customCssUrl) {
    switch (swaggerThemeFromEnv) {
      case 'monokai':
        customCssUrl = '/docs-assets/swagger-dark-monokai.css';
        break;
      case 'dracula':
        customCssUrl = '/docs-assets/swagger-dark-dracula.css';
        break;
      case 'default':
        customCssUrl = '/docs-assets/swagger-dark.css';
        break;
      default:
        customCssUrl = '/docs-assets/swagger-dark.css';
    }
  }

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Dentistry Shop API — Swagger',
    customCssUrl,
  });

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Bootstrap error:', err);
  process.exit(1);
});
