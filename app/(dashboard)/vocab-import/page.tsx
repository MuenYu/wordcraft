import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { VocabImportView } from './VocabImportView';

export default async function VocabImportPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <VocabImportView user={user} />;
}
