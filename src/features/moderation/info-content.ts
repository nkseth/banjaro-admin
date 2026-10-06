import type { InfobarContent } from '@/components/ui/infobar';

export const reportsInfoContent: InfobarContent = {
  title: 'Report queue',
  sections: [
    {
      title: 'Where these come from',
      description:
        'The `submitReport` callable in the app, rate-limited to 10 per person per hour. Nobody but this console can read them — the security rules deny client reads on `reports` outright.'
    },
    {
      title: 'Read the ×N badge first',
      description:
        'It counts how many reports name the same target. One complaint is a disagreement; four about the same person is a pattern, and that is the number worth acting on.'
    },
    {
      title: 'Resolve vs dismiss',
      description:
        'Resolve means you acted, dismiss means the report did not hold up. Keeping them apart is what tells you later whether a quiet account was cleared or simply never looked at.'
    },
    {
      title: 'Reported messages and notes',
      description:
        'These show only an id. `submitReport` stores the message id without its chat id, and a message cannot be found from the id alone — add the chat id to the report payload in the app if message moderation becomes routine.'
    }
  ]
};
