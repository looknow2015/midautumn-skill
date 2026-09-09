import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '中秋表达 Skill｜工银瑞信 AI时间合伙人',
  description: '把没说出口的心意，说得刚刚好。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
