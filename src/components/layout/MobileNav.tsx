'use client';

// ============================================
// Recipe Book — Mobile Navigation
// ============================================

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, PlusCircle, Layers } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';

export default function MobileNav() {
  const { t } = useApp();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: ChefHat, label: t.recipes },
    { href: '/dashboard/recipe/new', icon: PlusCircle, label: t.add },
    { href: '/dashboard/categories', icon: Layers, label: t.categories },
  ];

  return (
    <nav className="mobile-nav" aria-label={t.appName}>
      <ul className="mobile-nav-list">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
