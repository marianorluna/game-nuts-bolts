const CONTAINER_BASE =
  'flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2.5 overflow-hidden py-1'

export function getCampaignGridContainerClass(count: number): string {
  switch (count) {
    case 1:
      return `${CONTAINER_BASE} campaign-grid campaign-grid--1`
    case 2:
      return `${CONTAINER_BASE} campaign-grid campaign-grid--2`
    case 3:
      return `${CONTAINER_BASE} campaign-grid campaign-grid--3`
    case 4:
      return `${CONTAINER_BASE} campaign-grid campaign-grid--4`
    case 5:
      return `${CONTAINER_BASE} campaign-grid campaign-grid--5`
    case 6:
      return `${CONTAINER_BASE} campaign-grid campaign-grid--6`
    default:
      return `${CONTAINER_BASE} campaign-grid campaign-grid--6`
  }
}
