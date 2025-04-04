// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [
      starlight({
          title: 'Web API with .NET',
          social: {
              github: 'https://github.com/withastro/starlight',
          },
          sidebar: [
              {
                  label: 'Courses',
        autogenerate: { directory: 'courses' }
              },
              {
                  autogenerate: { directory: 'how-to' },
        label: 'Guides',
              },
      {
        label: 'Explainers',
        autogenerate: { directory: 'explainers'}
      }
          ],
      }),
	],

  adapter: vercel(),
});