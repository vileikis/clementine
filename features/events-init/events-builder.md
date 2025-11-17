# Goal

redesign events builder to support fully fledged flows with 4 key components: welcome, experiences, survey, ending

### Events UI

- When user navigates to specific event it should not render default app navigation on top, and render following instead:
- 1st row
  - Events > [Event name] Tab: Content, Distribute, Results Copy link (icon button) Status dropdown
  - When user clicks on "events" they get redirected to main events dashboard
  - When they click on [Event name] it should hos even edit name dialog
  - Content tab is default and opens event builder
  - Distribute tab opens distribute tab
  - Results tab opens event stats page (right now just placeholder)

### Content tab

This is the place where user can configure events' welcome, experiences, survey and ending content

Layout should consist of left side panel and main content

Left side panel split into sections

- Welcome - independent item, on click opens design settings for welcome screen with title, description and cta, color and bg color. In the main content user see controls and preview on the right
- Experiences (own section with + button)
  - on + adding new experience to the event, it should open dialog with ExperienceType selector
  - section should list created experiences ( use experience label for display)
  - when tapped on experience it should open in the main view experience editor, simillar to scene builder that we currently have (we decided to drop scenes in favor of more scalable experience collection )
  - experience do not need preview at this stage.
- Survey (own section with + button)
  - on + adding new survey step, it should open dialog with SurveyStepType selector
  - Toggle to disable/enable survey
  - Toggle to make survey required
  - list of survey steps (use step title to display)
  - it should be possible to reorder steps (reordering should be capture on the event level)
  - when clicked on the survey step it should open step's design settings + preview on the right
- Ending - independent item, on click opens design settings for end screen + share config fields. In the main content user see controls and preview on the right

Main content

- Depending on the selected item it should show design controls and preview on the right (if applicable)
- experience does not need preview at this stage as it is quite complex and needs separate preview feature. We don;t touch anything here

### Distribute tab

- Opens same content as we currently have in the app, no changes there

### Results tab

Will show in future event stats
Right now let's just show empty data, for example:

- Big picture
- 0 sessions, 0 shares, 0 downloads, 0 reach
  and below show
- WIP coming soon

## Data Model & Requirements

See detailed requirements and events data model from /Users/iggyvileikis/Projects/@attempt-n2/clementine/events-data-model.md

That doc focuses a lot on the guest experience behaviour, but in context of this project we focus primarely on event builder ( we will make separate project for guest experience ). Thus following collections can be out of scope /experienceItems, /participants, /sessions, /shares unless it is absolutely nececary to do some tweaks there.

Here are some constraints of what to include and not it:

- For events, denromalised counters are out of scope, then can be added but we don't add any logic to update them
- We only implemen photo ExperienceType, others can be present but disabled (coming soon) similr of how it is handled in the current scene builder

### Considerations

- I would prefer to implement new Events builder without logic first, so we can ensure that core layout is correct and in the next phases start adding logic.
