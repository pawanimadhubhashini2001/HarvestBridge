import { ResourceTablePage } from '../components/resources/ResourceTablePage';
import { Badge, statusTone } from '../components/ui/Badge';
import { formatDate } from '../lib/format';
import { deleteStory, getStories, hideStory } from '../services/admin';
import type { StoryRecord } from '../types/api';

export function StoriesPage() {
  return (
    <ResourceTablePage<StoryRecord>
      title="Stories"
      description="Moderate published store stories and expired or hidden content."
      fetcher={getStories}
      emptyTitle="No stories found"
      emptyDescription="Stories matching your search and filters will appear here."
      filters={[
        {
          key: 'state',
          label: 'All states',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Expired', value: 'expired' },
            { label: 'Hidden', value: 'hidden' },
          ],
        },
      ]}
      columns={[
        { key: 'caption', header: 'Caption', render: (story) => story.caption ?? 'No caption' },
        { key: 'store', header: 'Store', render: (story) => story.store?.store_name ?? 'Unknown store' },
        { key: 'district', header: 'District', render: (story) => story.store?.district ?? 'Not set' },
        { key: 'views', header: 'Views', render: (story) => story.view_count ?? 0 },
        { key: 'status', header: 'Status', render: (story) => <Badge tone={story.is_hidden ? 'red' : statusTone('active')}>{story.is_hidden ? 'Hidden' : 'Active'}</Badge> },
        { key: 'expires_at', header: 'Expires', render: (story) => formatDate(story.expires_at) },
      ]}
      actions={[
        {
          label: 'Hide',
          hidden: (story) => Boolean(story.is_hidden),
          confirmTitle: () => 'Hide this story?',
          confirmDescription: () => 'This keeps the story record but removes it from normal visibility.',
          onConfirm: (story) => hideStory(story.id).then(() => undefined),
        },
        {
          label: 'Delete',
          variant: 'danger',
          confirmTitle: () => 'Delete this story?',
          confirmDescription: () => 'This permanently removes the story media and record.',
          onConfirm: (story) => deleteStory(story.id).then(() => undefined),
        },
      ]}
    />
  );
}
