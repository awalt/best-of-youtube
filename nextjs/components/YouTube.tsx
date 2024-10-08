// File: app/components/ClientYouTubeEmbed.tsx
'use client'

import React from 'react'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

interface ClientYouTubeEmbedProps {
  id: string
  title: string
}

const ClientYouTubeEmbed: React.FC<ClientYouTubeEmbedProps> = ({ id, title }) => {
  return <LiteYouTubeEmbed id={id} title={title} />
}

export default ClientYouTubeEmbed