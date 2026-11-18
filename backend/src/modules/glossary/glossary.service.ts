import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@libs/prisma';
import { AiService } from '@libs/ai';
import { SUPPORTED_LOCALES } from '@common/locales';
import { SaveGlossaryTermDto } from './dto/glossary.dto';

const FIELDS = ['en', 'vi', 'zh', 'th', 'ja', 'note'] as const;
const TERM_SELECT = {
  id: true,
  en: true,
  vi: true,
  zh: true,
  th: true,
  ja: true,
  note: true,
} as const;

function clean(dto: SaveGlossaryTermDto) {
  return Object.fromEntries(
    FIELDS.filter((f) => dto[f] !== undefined).map((f) => [
      f,
      dto[f]?.trim() || null,
    ]),
  );
}

@Injectable()
export class GlossaryService {
  list() {
    return prisma.glossaryTerm.findMany({
      orderBy: [{ en: 'asc' }, { createdAt: 'asc' }],
      select: TERM_SELECT,
    });
  }

  async create(dto: SaveGlossaryTermDto) {
    const data = clean(dto);
    const terms = SUPPORTED_LOCALES.filter((f) => data[f]);
    if (terms.length === 0) {
      throw new BadRequestException('Add the term in at least one language');
    }
    const term = await prisma.glossaryTerm.create({
      data: { id: uuidv4(), ...data },
      select: TERM_SELECT,
    });
    AiService.clearGlossaryCache();
    return term;
  }

  async update(id: string, dto: SaveGlossaryTermDto) {
    const exists = await prisma.glossaryTerm.count({ where: { id } });
    if (!exists) throw new NotFoundException('Term not found');
    const term = await prisma.glossaryTerm.update({
      where: { id },
      data: clean(dto),
      select: TERM_SELECT,
    });
    AiService.clearGlossaryCache();
    return term;
  }

  async remove(id: string) {
    const exists = await prisma.glossaryTerm.count({ where: { id } });
    if (!exists) throw new NotFoundException('Term not found');
    await prisma.glossaryTerm.delete({ where: { id } });
    AiService.clearGlossaryCache();
    return { id };
  }
}
