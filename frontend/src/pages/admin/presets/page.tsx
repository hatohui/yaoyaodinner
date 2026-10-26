import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DebouncedInput } from '@/components/common/DebouncedInput'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PresetItemsList } from './@PresetItemsList'
import { PresetNoteField } from './@PresetNoteField'
import { usePresetMenu } from './@usePresetMenu'

export default function AdminPresetsPage() {
	const { t, i18n } = useTranslation()
	const {
		presets,
		isLoading,
		creating,
		selectedPreset,
		setActiveId,
		createPreset,
		updatePreset,
		deletePreset,
		addItem,
		removeItem,
		setQuantity,
		categories,
		creatingFood,
		createFood,
	} = usePresetMenu()

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<h1 className='text-xl font-bold text-foreground'>
					{t('admin.presets.title')}
				</h1>
				<Button
					size='sm'
					className='gap-1.5 rounded-full'
					disabled={creating}
					onClick={() => createPreset(0)}
				>
					<Plus data-icon='inline-start' />
					{t('admin.presets.new')}
				</Button>
			</div>

			{presets.length === 0 && !isLoading ? (
				<p className='py-16 text-center text-sm text-muted-foreground'>
					{t('admin.presets.empty')}
				</p>
			) : (
				<Tabs
					value={selectedPreset?.id ?? ''}
					onValueChange={setActiveId}
					className='flex flex-col gap-4'
				>
					<TabsList className='flex-wrap'>
						{presets.map((preset, idx) => (
							<TabsTrigger key={preset.id} value={preset.id}>
								{t('admin.presets.menu_label', { idx: idx + 1 })}
								{preset.isActive && (
									<Badge variant='default' className='ml-2 text-[10px]'>
										{t('admin.presets.active')}
									</Badge>
								)}
							</TabsTrigger>
						))}
					</TabsList>

					{presets.map(preset => (
						<TabsContent
							key={preset.id}
							value={preset.id}
							className='flex flex-col gap-4'
						>
							{/* Preset meta toolbar */}
							<div className='flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3'>
								<div className='flex flex-1 items-center gap-2'>
									<span className='whitespace-nowrap text-sm text-muted-foreground'>
										{t('admin.presets.price_label')}
									</span>
									<DebouncedInput
										type='number'
										value={String(preset.price ?? 0)}
										onCommit={v =>
											updatePreset(preset.id, { price: Number(v) })
										}
										className='h-8 w-28 rounded-full'
									/>
								</div>

								<div className='flex items-center gap-2'>
									<Button
										size='sm'
										variant={preset.isActive ? 'default' : 'outline'}
										className='rounded-full'
										onClick={() =>
											updatePreset(preset.id, { isActive: !preset.isActive })
										}
									>
										{preset.isActive
											? t('admin.presets.deactivate')
											: t('admin.presets.activate')}
									</Button>
									<Button
										size='sm'
										variant='ghost'
										className='rounded-full text-muted-foreground hover:text-destructive'
										onClick={() => deletePreset(preset.id)}
									>
										<Trash2 className='size-4' />
									</Button>
								</div>
							</div>

							<PresetNoteField
								note={preset.note}
								onCommit={note => updatePreset(preset.id, { note })}
							/>

							<PresetItemsList
								items={preset.items ?? []}
								isLoading={isLoading}
								lang={i18n.language}
								onQuantityChange={(variantId, quantity) =>
									setQuantity(preset.id, variantId, quantity)
								}
								onRemoveItem={variantId => removeItem(preset.id, variantId)}
								onAddItem={variantId => addItem(preset.id, variantId)}
								categories={categories}
								creatingFood={creatingFood}
								onCreateFood={(name, categoryId, price, imageUrl) =>
									createFood(preset.id, name, categoryId, price, imageUrl)
								}
							/>
						</TabsContent>
					))}
				</Tabs>
			)}
		</div>
	)
}
