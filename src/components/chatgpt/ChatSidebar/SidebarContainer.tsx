import SidebarHeader from './SidebarHeader';
import SidebarSearch from './SidebarSearch';
import NewChatButton from './NewChatButton';
import ChatList from './ChatList';
import LibraryList from './LibraryList';
import ProjectList from './ProjectList';
import GPTList from './GPTList';
import ProfileFooter from './ProfileFooter';

export default function SidebarContainer() {
  return (
    <aside className="w-72 max-w-xs bg-white border-r h-screen flex flex-col">
      <div className="flex-0">
        <SidebarHeader />
        <div className="px-3 py-2">
          <SidebarSearch />
          <NewChatButton />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 py-2">
        <ChatList />
        <div className="my-4 border-t pt-4">
          <LibraryList />
          <ProjectList />
          <GPTList />
        </div>
      </div>

      <div className="flex-none px-3 py-4">
        <ProfileFooter />
      </div>
    </aside>
  );
}
