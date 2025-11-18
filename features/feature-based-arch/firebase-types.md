Looking at the types file and usage, here's my recommendation:

I think we should split the types now because:

1. Feature-specific types are clearly defined: Event, Company,
   Experience, Session, SurveyStep types map directly to features
2. Already have type files in features: We created placeholder type files
   during migration but haven't populated them yet
3. 12 files importing from the shared location: A manageable number to
   update
4. Cleaner architecture: Each feature should own its types completely
5. Scene types can be removed: Scene, SceneStatus types are deprecated

The split would be:

- features/events/types/ → Event, EventStatus
- features/companies/types/ → Company, CompanyStatus
- features/experiences/types/ → Experience, ExperienceType, PreviewType,
  AspectRatio, ExperienceItem
- features/sessions/types/ → Session, SessionState
- lib/types/firestore.ts → Keep only: ShareSocial, Media, StatsOverview
  (truly shared types)
- Delete: Scene, SceneStatus, CaptureMode (deprecated)
