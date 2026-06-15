export interface AuthorLink {
  id: string
  label: string
  url: string
  icon: string
}

export interface AuthorConfig {
  name: string
  role: string
  bio: string
  avatar: string
  links: AuthorLink[]
}

/** Personaliza tus datos de autor aquí */
export const AUTHOR: AuthorConfig = {
  name: 'Mariano Luna',
  role: 'Developer',
  bio: 'Desarrollo soluciones para problemas reales. Soy apasionado por la tecnología y el desarrollo de software. Este juego es un proyecto personal para aprender game design mobile.',
  avatar: '👩‍💻',
  links: [
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/marianorluna',
      icon: '⌨️',
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      url: 'https://marianorluna.com',
      icon: '🌐',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      url: 'https://linkedin.com/in/marianorluna',
      icon: '💼',
    },
    {
      id: 'email',
      label: 'Email',
      url: 'mailto:contacto@marianorluna.com',
      icon: '✉️',
    },
  ],
}
