import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'SITRA IA | Gestão de Recursos', description: 'Sistema Inteligente de Trânsito e Recursos Administrativos' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
