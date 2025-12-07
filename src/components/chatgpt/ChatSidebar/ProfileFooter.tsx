export default function ProfileFooter(){
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">A</div>
              <div className='mt-3'><button onClick={()=>window.location.hash='#/settings'} className='text-sm text-blue-600'>Settings</button></div>
            
      <div className="flex-1">
        <div className="text-sm font-medium">Divyansh</div>
              <div className='mt-3'><button onClick={()=>window.location.hash='#/settings'} className='text-sm text-blue-600'>Settings</button></div>
            
        <div className="text-xs text-gray-500">Account</div>
              <div className='mt-3'><button onClick={()=>window.location.hash='#/settings'} className='text-sm text-blue-600'>Settings</button></div>
            
      </div>
              <div className='mt-3'><button onClick={()=>window.location.hash='#/settings'} className='text-sm text-blue-600'>Settings</button></div>
            
    </div>
              <div className='mt-3'><button onClick={()=>window.location.hash='#/settings'} className='text-sm text-blue-600'>Settings</button></div>
            
  );
}
