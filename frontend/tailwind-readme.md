# Styling Guide

This project uses Tailwind CSS for styling. Here are some guidelines:

## Responsive Design
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Mobile-first approach is recommended

## Common Patterns
- Container: `container mx-auto px-4`
- Flex center: `flex items-center justify-center`
- Grid layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

## Colors
- Primary: `bg-blue-600 text-white`
- Secondary: `bg-gray-600 text-white`
- Success: `bg-green-600 text-white`
- Warning: `bg-yellow-600 text-black`
- Error: `bg-red-600 text-white`

## Spacing
- Use consistent spacing: `p-4`, `m-4`, `gap-4`
- For larger spacing: `p-8`, `m-8`, `gap-8`

## Typography
- Headings: `text-2xl font-bold`, `text-xl font-semibold`
- Body text: `text-base`, `text-sm`
- Links: `text-blue-600 hover:text-blue-800 underline`

Refer to the Tailwind CSS documentation for more utilities: https://tailwindcss.com/docs
