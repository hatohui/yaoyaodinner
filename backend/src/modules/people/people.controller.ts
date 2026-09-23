import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdatePersonPfpDto } from './dto/update-person-pfp.dto';
import { MovePeopleDto } from './dto/move-people.dto';
import { PersonDto } from './dto/person-response.dto';
import { IdsDto } from '@common/dto/ids.dto';
import { AdminGuard } from '@common/guards/admin.guard';

@ApiTags('people')
@Controller('people')
export class PeopleController {
  constructor(private people: PeopleService) {}

  @Get()
  @ApiOperation({ operationId: 'getPeople' })
  findAll() {
    return this.people.findAll();
  }

  @Post()
  @ApiOperation({ operationId: 'createPerson' })
  @ApiResponse({ status: 201, type: PersonDto })
  create(@Body() dto: CreatePersonDto) {
    return this.people.create(dto);
  }

  @Post('move')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'movePeople' })
  move(@Body() dto: MovePeopleDto) {
    return this.people.move(dto.ids, dto.tableId);
  }

  @Post('bulk-delete')
  @UseGuards(AdminGuard)
  @ApiOperation({ operationId: 'bulkDeletePeople' })
  bulkDelete(@Body() dto: IdsDto) {
    return this.people.bulkRemove(dto.ids);
  }

  // Open like create/delete: guests fix their own names on the roster
  @Patch(':id')
  @ApiOperation({ operationId: 'updatePerson' })
  @ApiResponse({ status: 200, type: PersonDto })
  update(@Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.people.update(id, dto);
  }

  @Patch(':id/pfp')
  @ApiOperation({ operationId: 'updatePersonPfp' })
  @ApiResponse({ status: 200, type: PersonDto })
  updatePfp(@Param('id') id: string, @Body() dto: UpdatePersonPfpDto) {
    return this.people.updatePfp(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deletePerson' })
  remove(@Param('id') id: string) {
    return this.people.remove(id);
  }
}
