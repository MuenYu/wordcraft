import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { StudyView } from './StudyView';

// eslint-disable-next-line import/no-default-export
export default async function StudyPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <StudyView />;
}
