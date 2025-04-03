import { assets } from '@/assets/assets'
import React from 'react'
import Image from 'next/image'

const ChatLabel = ({ openMenu, setOpenMenu }) => {
  return (
    <div className='flex items-center justify-between p-2 text-white/80 hover:bg-white/10 rounded-lg text-sm group cursor-pointer'>
      <p className='group-hover:max-w-[83.333%] truncate'>Chat Name Here</p>
      <div className='group relative flex items-center justify-center h-6 w-6 aspect-square hover:bg-black/80 rounded-lg'>
        <Image 
          src={assets.three_dots} 
          alt="Menu" 
          width={16}
          height={16}
          className={`w-4 ${openMenu.open ? 'block' : 'hidden'} group-hover:block`} 
        />
        <div className={`absolute ${openMenu.open ? 'block' : 'hidden'} right-0 top-6 bg-gray-700 rounded-xl w-max p-2 z-10`}>
          <div className='flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-xl'>
            <Image 
              src={assets.pencil_icon} 
              alt="Rename" 
              width={16}
              height={16}
              className='w-4'
            />
            <p>Rename</p>
          </div>
          <div className='flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-xl'>
            <Image 
              src={assets.delete_icon} 
              alt="Delete" 
              width={16}
              height={16}
              className='w-4'
            />
            <p>Delete</p>
          </div>
        </div>      
      </div>
    </div>
  )
}

export default ChatLabel