import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins });
  } else {
    app.enableCors();
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

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
    .addServer('http://localhost:3000')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Dentistry Shop API — Swagger',
    customCss: `
      body { background-color: #121212; color: #e0e0e0; }
      .swagger-ui, .swagger-ui * { color-scheme: dark; }
      .swagger-ui .topbar { background-color: #1f1f1f; border-bottom: 1px solid #333; }
      .swagger-ui .topbar a span { color: #e0e0e0 !important; }
      .swagger-ui .info h1, .swagger-ui .info p { color: #e0e0e0; }
      .swagger-ui .scheme-container { background: #1e1e1e; border-color: #333; }
      .swagger-ui .opblock { background: #1e1e1e; border-color: #333; }
      .swagger-ui .opblock .opblock-summary { background: #2a2a2a; border-color: #3a3a3a; }
      .swagger-ui .opblock .opblock-summary-description, .swagger-ui .opblock .opblock-summary-path { color: #ddd; }
      .swagger-ui .opblock .opblock-summary-method { background: #444; color: #fff; border-color: #555; }
      .swagger-ui .opblock .opblock-section-header { background: #2a2a2a; border-color: #3a3a3a; color: #e0e0e0; }
      .swagger-ui .btn, .swagger-ui .authorization__btn { background: #444; color: #fff; border-color: #666; }
      .swagger-ui .btn.authorize { background: #04d47a; color: #000; border-color: #04d47a; }
      .swagger-ui input, .swagger-ui select, .swagger-ui textarea { background: #1b1b1b; color: #eee; border: 1px solid #444; }
      .swagger-ui .model-box { background: #1b1b1b; border-color: #333; }
      .swagger-ui .response-col_status, .swagger-ui table thead tr th { color: #ddd; }
      .swagger-ui .responses-inner { background: #1b1b1b; }
      .swagger-ui .tab li { color: #ddd; }
      .swagger-ui .markdown code, .swagger-ui code { background: #333; color: #eee; }
      .swagger-ui .copy-to-clipboard { background: #2a2a2a; }
    `,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Bootstrap error:', err);
  process.exit(1);
});
