import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ManualTranslationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceName: string
  title?: string
  onSave: (translations: Record<string, string>) => Promise<void>
}

const TARGET_LANGS = ['en', 'vi', 'zh', 'th']

export function ManualTranslationDialog({
  open,
  onOpenChange,
  sourceName,
  title,
  onSave,
}: ManualTranslationDialogProps) {
  const { t, i18n } = useTranslation()
  const [translations, setTranslations] = React.useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = React.useState(false)

  const targets = React.useMemo(() => TARGET_LANGS.filter(l => l !== i18n.language), [i18n.language])

  React.useEffect(() => {
    if (open) {
      setTranslations({})
    }
  }, [open])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(translations)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? t('admin.translation.fallback_title', 'AI Translation Failed')}</DialogTitle>
          <DialogDescription>
            {t('admin.translation.fallback_desc', 'Please provide translations manually for: ')}
            <strong className="text-foreground">{sourceName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {targets.map(lang => (
            <div key={lang} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`lang-${lang}`} className="text-right uppercase font-bold text-muted-foreground">
                {lang}
              </Label>
              <Input
                id={`lang-${lang}`}
                value={translations[lang] || ''}
                onChange={e => setTranslations(prev => ({ ...prev, [lang]: e.target.value }))}
                className="col-span-3"
                placeholder={t(`admin.translation.placeholder_${lang}`, `Name in ${lang}`)}
                autoComplete="off"
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
