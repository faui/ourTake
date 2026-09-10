import type { Metadata } from 'next';
import './globals.css';
import './player.css';
export const metadata: Metadata={title:'ourTake — Our moments, together.',description:'Bring your cameras together. Explore another angle and make your own take.',icons:{icon:'/ourframe-mark.svg'},manifest:'/manifest.webmanifest'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
